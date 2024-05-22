"use server";

import { signIn } from "@/auth";
import prisma from "@/lib/db";
import { signUpSchema } from "@/lib/zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";

export const register = async (values: z.infer<typeof signUpSchema>) => {
  const validatedFields = signUpSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid Fields!" };
  }

  const {
    firstName,
    lastName,
    address1,
    city,
    state,
    aadhar,
    postalCode,
    dateOfBirth,
    email,
    password,
  } = validatedFields.data;

  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    return { error: "Email already in use!" };
  }

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      address1,
      dwollaCustomerId: "",
      dwollaCustomerUrl: "",
      city,
      state,
      aadhar,
      postalCode,
      dateOfBirth,
      email,
      password: hashedPassword,
    },
  });

  try {
    await signIn("credentials", {
      email,
      password,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" };
        default:
          return { error: "Something went wrong!" };
      }
    }

    throw error;
  }

  return user;
};