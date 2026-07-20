import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { CollegeModel } from "../models/college.model.js";
import { DepartmentModel } from "../models/department.model.js";
import { logger } from "../utils/logger.js";

const departments = [
  { name: "B.E Civil Engineering", code: "CIVIL" },
  { name: "B.E Mechanical Engineering", code: "MECH" },
  { name: "B.E Electronics and Communication Engineering", code: "ECE" },
  { name: "B.E Computer Science and Engineering", code: "CSE" },
  { name: "B.Tech Chemical Engineering", code: "CHEM" },
  { name: "B.E Electrical and Electronics Engineering", code: "EEE" },
  { name: "B.E Electronics and Instrumentation Engineering", code: "EIE" },
  { name: "B.Tech Information Technology", code: "ITECH" },
  { name: "B.E Mechatronics Engineering", code: "MCT" },
  { name: "B.Tech Food Technology", code: "FOOD" },
  { name: "B.E Automobile Engineering", code: "AUTO" },
  { name: "B.E Computer Science and Design", code: "CSD" },
  { name: "B.Tech Artificial Intelligence and Machine Learning", code: "AIML" },
  { name: "B.Tech Artificial Intelligence and Data Science", code: "AIDS" },
  { name: "B.Arch (Architecture)", code: "ARCH" }
] as const;

const run = async (): Promise<void> => {
  await connectDatabase();

  const college = await CollegeModel.findOneAndUpdate(
    { code: "KEC" },
    {
      $set: {
        name: "Kongu Engineering College",
        code: "KEC",
        address: {
          line1: "Perundurai Railway Station Road, Thoppupalayam",
          city: "Perundurai",
          state: "Tamil Nadu",
          postalCode: "638060",
          country: "India"
        },
        contactEmail: "principal@kongu.ac.in",
        contactPhone: "+914294226555",
        website: "https://kongu.ac.in",
        isActive: true
      }
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  if (!college) throw new Error("Unable to create or update KEC");

  await Promise.all(
    departments.map(async (department) =>
      DepartmentModel.findOneAndUpdate(
        { college: college._id, code: department.code },
        {
          $set: {
            name: department.name,
            code: department.code,
            isActive: true
          }
        },
        { upsert: true, runValidators: true, setDefaultsOnInsert: true }
      )
    )
  );

  logger.info("KEC reference data synchronized", {
    college: college.name,
    code: college.code,
    departments: departments.length
  });
};

const main = async (): Promise<void> => {
  try {
    await run();
  } catch (error) {
    logger.error(
      "KEC reference-data synchronization failed",
      error instanceof Error ? error.message : String(error)
    );
    process.exitCode = 1;
  } finally {
    await disconnectDatabase().catch(() => undefined);
  }
};

void main();
