declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: string;
        userModel: "Admin" | "Volunteer";
        sessionId?: string;
      };
    }
  }
}

export {};
