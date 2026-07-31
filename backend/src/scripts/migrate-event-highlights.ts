import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { logger } from "../utils/logger.js";

interface LegacyEvent {
  _id: mongoose.Types.ObjectId;
  eventType: string;
  eventTypeDescription?: string;
}

// One-off migration: events created before the "highlights" feature stored a
// single eventType/eventTypeDescription pair. Copy that into highlights[0] so
// existing events keep showing a "what's happening" entry after deploy.
const run = async (): Promise<void> => {
  await connectDatabase();

  const collection = mongoose.connection.collection<LegacyEvent>("events");
  const legacyEvents = await collection
    .find({ eventType: { $exists: true }, highlights: { $exists: false } })
    .toArray();

  logger.info(`Found ${legacyEvents.length} event(s) with legacy eventType data`);

  for (const event of legacyEvents) {
    await collection.updateOne(
      { _id: event._id },
      {
        $set: {
          highlights: [
            {
              _id: new mongoose.Types.ObjectId(),
              title: event.eventType,
              ...(event.eventTypeDescription ? { description: event.eventTypeDescription } : {})
            }
          ]
        },
        $unset: { eventType: "", eventTypeDescription: "" }
      }
    );
    logger.info(`Migrated event ${event._id.toString()}`);
  }

  logger.info("Migration complete");
};

const main = async (): Promise<void> => {
  try {
    await run();
  } catch (error) {
    logger.error("Migration failed", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await disconnectDatabase().catch(() => undefined);
  }
};

void main();
