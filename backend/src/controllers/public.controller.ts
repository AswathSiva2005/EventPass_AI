import { CollegeModel } from "../models/college.model.js";
import { DepartmentModel } from "../models/department.model.js";
import { EventModel } from "../models/event.model.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess } from "../utils/response.js";

export const listEventsController = asyncHandler(async (request, response) => {
  const now = new Date();
  const events = await EventModel.find({
    status: request.query.status === "ongoing" ? "ongoing" : "published",
    ...(request.query.upcoming === "true"
      ? { startsAt: { $gt: now }, registrationClosesAt: { $gte: now } }
      : {})
  })
    .select(
      "name code description college venue startsAt endsAt registrationClosesAt capacity registrationCount status"
    )
    .populate("college", "name code")
    .sort({ startsAt: 1 })
    .lean();
  // A deleted reference is populated as null. Do not publish an event that
  // students cannot complete registration for.
  const completeEvents = events.filter((event) => event.college !== null);
  sendSuccess(response, { message: "Events retrieved", data: completeEvents });
});

export const listCollegesController = asyncHandler(async (_request, response) => {
  const colleges = await CollegeModel.find({ isActive: true })
    .select("name code")
    .sort({ name: 1 })
    .lean();
  sendSuccess(response, { message: "Colleges retrieved", data: colleges });
});

export const listDepartmentsController = asyncHandler(async (request, response) => {
  const college = request.query.college;
  const departments = await DepartmentModel.find({
    college: typeof college === "string" ? college : "",
    isActive: true
  })
    .select("name code college")
    .sort({ name: 1 })
    .lean();
  sendSuccess(response, { message: "Departments retrieved", data: departments });
});
