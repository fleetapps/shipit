export var CurrentDevState;
(function (CurrentDevState) {
    CurrentDevState[CurrentDevState["IDLE"] = 0] = "IDLE";
    CurrentDevState[CurrentDevState["PHASE_GENERATING"] = 1] = "PHASE_GENERATING";
    CurrentDevState[CurrentDevState["PHASE_IMPLEMENTING"] = 2] = "PHASE_IMPLEMENTING";
    CurrentDevState[CurrentDevState["REVIEWING"] = 3] = "REVIEWING";
    CurrentDevState[CurrentDevState["FINALIZING"] = 4] = "FINALIZING";
})(CurrentDevState || (CurrentDevState = {}));
export const MAX_PHASES = 12;
