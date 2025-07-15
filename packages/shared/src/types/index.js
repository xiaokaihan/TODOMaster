"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskStatus = exports.ObjectiveStatus = exports.Priority = exports.ObjectiveCategory = void 0;
// 枚举类型
var ObjectiveCategory;
(function (ObjectiveCategory) {
    ObjectiveCategory["PERSONAL"] = "PERSONAL";
    ObjectiveCategory["PROFESSIONAL"] = "PROFESSIONAL";
    ObjectiveCategory["HEALTH"] = "HEALTH";
    ObjectiveCategory["LEARNING"] = "LEARNING";
    ObjectiveCategory["FINANCIAL"] = "FINANCIAL";
    ObjectiveCategory["RELATIONSHIP"] = "RELATIONSHIP";
    ObjectiveCategory["CREATIVE"] = "CREATIVE";
    ObjectiveCategory["OTHER"] = "OTHER"; // 其他
})(ObjectiveCategory || (exports.ObjectiveCategory = ObjectiveCategory = {}));
var Priority;
(function (Priority) {
    Priority["LOW"] = "LOW";
    Priority["MEDIUM"] = "MEDIUM";
    Priority["HIGH"] = "HIGH";
    Priority["CRITICAL"] = "CRITICAL";
})(Priority || (exports.Priority = Priority = {}));
var ObjectiveStatus;
(function (ObjectiveStatus) {
    ObjectiveStatus["DRAFT"] = "DRAFT";
    ObjectiveStatus["ACTIVE"] = "ACTIVE";
    ObjectiveStatus["ON_HOLD"] = "ON_HOLD";
    ObjectiveStatus["COMPLETED"] = "COMPLETED";
    ObjectiveStatus["CANCELLED"] = "CANCELLED"; // 已取消
})(ObjectiveStatus || (exports.ObjectiveStatus = ObjectiveStatus = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["TODO"] = "TODO";
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatus["WAITING"] = "WAITING";
    TaskStatus["COMPLETED"] = "COMPLETED";
    TaskStatus["CANCELLED"] = "CANCELLED"; // 已取消
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
//# sourceMappingURL=index.js.map