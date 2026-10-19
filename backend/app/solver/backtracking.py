"""Backtracking CSP solver with MRV, Degree heuristic, and Forward Checking."""
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Set
import copy

from app.models.schemas import (
    SolverEvent, SolverStats, ScheduleResponse, StudySession
)
from app.solver.csp import CSPProblem, CSPVariable, TimeSlot


class CSPSolver:
    """
    Backtracking Constraint Satisfaction Problem Solver for study schedules.
    Implements MRV heuristic, Degree heuristic tie-breaker, Forward Checking,
    and structured event streaming for the UI activity panel.
    """
    def __init__(self, problem: CSPProblem):
        self.problem = problem
        self.events: List[SolverEvent] = []
        self.step_counter = 0
        self.assignments_attempted = 0
        self.backtracks = 0
        self.start_time_s = 0.0
        self.timeout_s = problem.settings.search_timeout_seconds
        self.max_backtracks = problem.settings.max_backtracks
        self.search_limit_reached = False

        # Working assignment: var_id -> TimeSlot
        self.assignment: Dict[str, TimeSlot] = {}

    def _log_event(
        self,
        event_type: str,
        variable_name: Optional[str] = None,
        slot_description: Optional[str] = None,
        reason: Optional[str] = None
    ):
        """Append an event to the solver activity log (max 300 events for UI responsiveness)."""
        self.step_counter += 1
        elapsed_ms = round((time.perf_counter() - self.start_time_s) * 1000.0, 2)
        if len(self.events) < 300:
            self.events.append(
                SolverEvent(
                    step=self.step_counter,
                    event_type=event_type,  # type: ignore
                    variable_name=variable_name,
                    slot_description=slot_description,
                    reason=reason,
                    timestamp_ms=elapsed_ms
                )
            )

    def solve(self) -> Tuple[bool, Dict[str, TimeSlot], SolverStats, List[SolverEvent]]:
        """Run backtracking search with MRV and forward checking."""
        self.start_time_s = time.perf_counter()
        self.events = []
        self.step_counter = 0
        self.assignments_attempted = 0
        self.backtracks = 0
        self.assignment = {}
        self.search_limit_reached = False

        # Make a copy of domains for forward checking
        domains: Dict[str, List[TimeSlot]] = {
            var.var_id: list(var.domain) for var in self.problem.variables
        }

        # Check immediate domain wipeouts before search starts
        for var in self.problem.variables:
            if len(domains[var.var_id]) == 0:
                self._log_event(
                    event_type="infeasible",
                    variable_name=var.display_name,
                    reason=f"Empty initial domain for '{var.display_name}'! No available slots before deadline {var.deadline_dt.strftime('%d-%b %H:%M')}."
                )
                elapsed_ms = round((time.perf_counter() - self.start_time_s) * 1000.0, 2)
                stats = SolverStats(
                    total_variables=len(self.problem.variables),
                    assignments_attempted=0,
                    backtracks=0,
                    elapsed_time_ms=elapsed_ms,
                    search_limit_reached=False,
                    status="INFEASIBLE"
                )
                return False, {}, stats, self.events

        # Run recursive backtracking
        success = self._backtrack(domains)

        elapsed_ms = round((time.perf_counter() - self.start_time_s) * 1000.0, 2)
        status = "FEASIBLE" if success else ("SEARCH_LIMIT_REACHED" if self.search_limit_reached else "INFEASIBLE")
        
        if success:
            self._log_event(
                event_type="solution_found",
                reason=f"Feasible schedule found with 0 hard-constraint violations across {len(self.problem.variables)} sessions!"
            )
        elif self.search_limit_reached:
            self._log_event(
                event_type="search_limit",
                reason=f"Search limit reached ({self.backtracks} backtracks or {self.timeout_s}s timeout). Feasibility unknown."
            )
        else:
            self._log_event(
                event_type="infeasible",
                reason="Search exhausted all permutations without finding a conflict-free schedule."
            )

        stats = SolverStats(
            total_variables=len(self.problem.variables),
            assignments_attempted=self.assignments_attempted,
            backtracks=self.backtracks,
            elapsed_time_ms=elapsed_ms,
            search_limit_reached=self.search_limit_reached,
            status=status  # type: ignore
        )

        return success, self.assignment, stats, self.events

    def _select_unassigned_variable(
        self, domains: Dict[str, List[TimeSlot]]
    ) -> Optional[CSPVariable]:
        """
        MRV (Minimum Remaining Values) heuristic:
        Select variable with the smallest domain size.
        Tie-breaker: Degree heuristic (higher priority, then earlier deadline, then longer duration).
        """
        unassigned = [
            var for var in self.problem.variables if var.var_id not in self.assignment
        ]
        if not unassigned:
            return None

        # Sort by:
        # 1. Domain size (ascending - MRV)
        # 2. Priority (descending - tie breaker)
        # 3. Deadline (ascending - tie breaker)
        # 4. Duration (descending - tie breaker)
        def sort_key(var: CSPVariable):
            dom_len = len(domains[var.var_id])
            return (
                dom_len,
                -var.priority,
                var.deadline_dt,
                -var.duration_hours
            )

        unassigned.sort(key=sort_key)
        selected = unassigned[0]

        self._log_event(
            event_type="variable_selected",
            variable_name=selected.display_name,
            reason=f"MRV selected: {len(domains[selected.var_id])} candidate slots remaining (Priority {selected.priority})"
        )
        return selected

    def _order_domain_values(
        self, var: CSPVariable, candidate_slots: List[TimeSlot]
    ) -> List[TimeSlot]:
        """
        Soft preference value ordering:
        Prioritize slots matching student's preferred study windows,
        and earlier slots in the day for high-priority subjects.
        """
        def slot_score(slot: TimeSlot) -> float:
            score = 0.0
            # Preferred study windows check
            slot_time_str = slot.start_dt.strftime("%H:%M")
            for win in self.problem.routine.preferred_study_windows:
                if win.start_time <= slot_time_str <= win.end_time:
                    score -= 50.0 * win.preference_weight
            
            # Prefer earlier days for high priority
            score += slot.day_index * (6 - var.priority) * 5.0
            # Earlier hours
            score += slot.start_dt.hour
            return score

        return sorted(candidate_slots, key=slot_score)

    def _is_consistent(self, var: CSPVariable, slot: TimeSlot) -> Tuple[bool, Optional[str]]:
        """
        Check if assigning 'slot' to 'var' satisfies all hard constraints
        with already assigned variables.
        """
        buffer_mins = self.problem.routine.min_break_minutes

        # Constraint 1: No overlap with any existing assignment (plus buffer)
        for other_var_id, other_slot in self.assignment.items():
            if slot.overlaps_with(other_slot, buffer_minutes=buffer_mins):
                return False, f"Overlaps with already assigned session '{other_var_id}' (buffer: {buffer_mins}m)"

        # Constraint 2: Chunk sequential ordering for the same topic
        if not var.is_revision:
            for other_var in self.problem.variables:
                if other_var.topic_id == var.topic_id and not other_var.is_revision:
                    if other_var.var_id in self.assignment:
                        other_slot = self.assignment[other_var.var_id]
                        if var.chunk_index > other_var.chunk_index and slot.start_dt < other_slot.end_dt:
                            return False, f"Part {var.chunk_index} cannot start before Part {other_var.chunk_index} finishes"
                        if var.chunk_index < other_var.chunk_index and slot.end_dt > other_slot.start_dt:
                            return False, f"Part {var.chunk_index} must end before Part {other_var.chunk_index} starts"

        # Constraint 3: Revision ordering
        if var.is_revision:
            for other_var in self.problem.variables:
                if other_var.topic_id == var.topic_id and not other_var.is_revision:
                    if other_var.var_id in self.assignment:
                        study_slot = self.assignment[other_var.var_id]
                        if slot.start_dt < study_slot.end_dt:
                            return False, f"Revision session must take place after all study chunks for '{var.name}'"
        else:
            for other_var in self.problem.variables:
                if other_var.topic_id == var.topic_id and other_var.is_revision:
                    if other_var.var_id in self.assignment:
                        rev_slot = self.assignment[other_var.var_id]
                        if slot.end_dt > rev_slot.start_dt:
                            return False, f"Study chunk must end before the topic's revision session starts"

        return True, None

    def _forward_check(
        self,
        assigned_var: CSPVariable,
        assigned_slot: TimeSlot,
        domains: Dict[str, List[TimeSlot]]
    ) -> Tuple[bool, Dict[str, List[TimeSlot]]]:
        """
        Forward checking: Filter candidate slots of unassigned variables
        that would clash with assigned_slot.
        Returns (success, pruned_domains). If any unassigned variable's domain becomes empty,
        forward checking fails immediately (domain wipeout).
        """
        buffer_mins = self.problem.routine.min_break_minutes
        new_domains: Dict[str, List[TimeSlot]] = {}

        for var in self.problem.variables:
            if var.var_id in self.assignment:
                continue

            filtered_slots: List[TimeSlot] = []
            for slot in domains[var.var_id]:
                # 1. No overlap
                if slot.overlaps_with(assigned_slot, buffer_minutes=buffer_mins):
                    continue

                # 2. Sequential ordering for same topic chunks
                if var.topic_id == assigned_var.topic_id:
                    if not var.is_revision and not assigned_var.is_revision:
                        if var.chunk_index > assigned_var.chunk_index and slot.start_dt < assigned_slot.end_dt:
                            continue
                        if var.chunk_index < assigned_var.chunk_index and slot.end_dt > assigned_slot.start_dt:
                            continue
                    elif var.is_revision and not assigned_var.is_revision:
                        if slot.start_dt < assigned_slot.end_dt:
                            continue
                    elif not var.is_revision and assigned_var.is_revision:
                        if slot.end_dt > assigned_slot.start_dt:
                            continue

                filtered_slots.append(slot)

            if len(filtered_slots) == 0:
                # Domain wipeout detected
                self._log_event(
                    event_type="constraint_violated",
                    variable_name=var.display_name,
                    slot_description=str(assigned_slot),
                    reason=f"Forward Checking detected domain wipeout for '{var.display_name}'! Backtracking."
                )
                return False, domains

            new_domains[var.var_id] = filtered_slots

        return True, new_domains

    def _backtrack(self, domains: Dict[str, List[TimeSlot]]) -> bool:
        """Core recursive backtracking procedure with MRV and Forward Checking."""
        # Check termination limits
        if (time.perf_counter() - self.start_time_s) > self.timeout_s:
            self.search_limit_reached = True
            return False

        if self.backtracks >= self.max_backtracks:
            self.search_limit_reached = True
            return False

        # If all variables assigned, solution found!
        if len(self.assignment) == len(self.problem.variables):
            return True

        # Choose next variable using MRV + Degree heuristic
        var = self._select_unassigned_variable(domains)
        if var is None:
            return True

        ordered_slots = self._order_domain_values(var, domains[var.var_id])

        for slot in ordered_slots:
            self.assignments_attempted += 1
            slot_desc = f"Day {slot.day_index} {slot.start_dt.strftime('%H:%M')}-{slot.end_dt.strftime('%H:%M')}"
            
            self._log_event(
                event_type="slot_considered",
                variable_name=var.display_name,
                slot_description=slot_desc,
                reason="Testing candidate slot consistency"
            )

            consistent, reason = self._is_consistent(var, slot)
            if not consistent:
                self._log_event(
                    event_type="constraint_violated",
                    variable_name=var.display_name,
                    slot_description=slot_desc,
                    reason=reason
                )
                continue

            # Assign variable
            self.assignment[var.var_id] = slot
            self._log_event(
                event_type="assignment_accepted",
                variable_name=var.display_name,
                slot_description=slot_desc,
                reason="Slot is conflict-free with current partial assignment"
            )

            # Perform forward checking
            fc_ok, updated_domains = self._forward_check(var, slot, domains)
            if fc_ok:
                # Merge updated domains
                next_domains = {**domains, **updated_domains}
                result = self._backtrack(next_domains)
                if result:
                    return True

            # Backtracking step
            self.backtracks += 1
            del self.assignment[var.var_id]
            self._log_event(
                event_type="backtrack",
                variable_name=var.display_name,
                slot_description=slot_desc,
                reason=f"Backtracking step #{self.backtracks}: unassigned slot, exploring alternatives"
            )

        return False
