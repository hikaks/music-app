import { prisma } from "@harmonix-mobile/database";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppBindings } from "../../server";
import { requireUser } from "../../middleware/requireUser";
import { deviceCreateSchema, profileUpdateSchema } from "./schemas";

export const userRoutes = new Hono<AppBindings>();

userRoutes.use("/me/*", requireUser);
userRoutes.use("/me", requireUser);

userRoutes.get("/me", async (c) => {
  const user = c.get("user");

  if (!user) {
    throw new HTTPException(401, { message: "Authentication required" });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      emailVerified: user.emailVerified,
    },
    profile,
  });
});

userRoutes.patch("/me/profile", async (c) => {
  const user = c.get("user");

  if (!user) {
    throw new HTTPException(401, { message: "Authentication required" });
  }

  const body = profileUpdateSchema.parse(await c.req.json());
  const profileData: {
    displayName?: string;
    imageUrl?: string;
    country?: string;
    locale?: string;
  } = {};

  if (body.displayName !== undefined) profileData.displayName = body.displayName;
  if (body.imageUrl !== undefined) profileData.imageUrl = body.imageUrl;
  if (body.country !== undefined) profileData.country = body.country;
  if (body.locale !== undefined) profileData.locale = body.locale;

  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...profileData,
    },
    update: profileData,
  });

  return c.json({ profile });
});

userRoutes.get("/me/devices", async (c) => {
  const user = c.get("user");

  if (!user) {
    throw new HTTPException(401, { message: "Authentication required" });
  }

  const devices = await prisma.device.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return c.json({ devices });
});

userRoutes.post("/me/devices", async (c) => {
  const user = c.get("user");

  if (!user) {
    throw new HTTPException(401, { message: "Authentication required" });
  }

  const body = deviceCreateSchema.parse(await c.req.json());
  const deviceData: {
    userId: string;
    platform: "ios" | "android" | "web" | "unknown";
    name?: string;
    pushToken?: string;
  } = {
    userId: user.id,
    platform: body.platform,
  };

  if (body.name !== undefined) deviceData.name = body.name;
  if (body.pushToken !== undefined) deviceData.pushToken = body.pushToken;

  const device = await prisma.device.create({
    data: deviceData,
  });

  return c.json({ device }, 201);
});

userRoutes.delete("/me/devices/:id", async (c) => {
  const user = c.get("user");

  if (!user) {
    throw new HTTPException(401, { message: "Authentication required" });
  }

  const id = c.req.param("id");
  const device = await prisma.device.findFirst({
    where: { id, userId: user.id },
  });

  if (!device) {
    throw new HTTPException(404, { message: "Device not found" });
  }

  await prisma.device.delete({
    where: { id },
  });

  return c.json({ ok: true });
});
