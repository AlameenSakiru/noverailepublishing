import React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { SuccessClient } from "./SuccessClient";

export const dynamic = "force-dynamic";

interface SuccessPageProps {
  searchParams: {
    orderNumber?: string;
  };
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { orderNumber } = searchParams;

  if (!orderNumber) {
    notFound();
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: {
        include: {
          book: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return <SuccessClient order={order} />;
}
