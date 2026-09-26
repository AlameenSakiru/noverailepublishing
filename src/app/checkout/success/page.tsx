import React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { SuccessClient } from "./SuccessClient";

export const dynamic = "force-dynamic";

interface SuccessPageProps {
  searchParams: {
    orderNumber?: string;
    reference?: string;
    trxref?: string;
    session_id?: string;
    provider?: string;
  };
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const orderIdentifier =
    searchParams.orderNumber || searchParams.reference || searchParams.trxref;

  if (!orderIdentifier) {
    notFound();
  }

  // Look up order by orderNumber or stripeSessionId / reference
  let order = await prisma.order.findUnique({
    where: { orderNumber: orderIdentifier },
    include: {
      items: {
        include: {
          book: true,
        },
      },
    },
  });

  if (!order) {
    order = await prisma.order.findFirst({
      where: {
        OR: [
          { stripeSessionId: orderIdentifier },
          { id: orderIdentifier },
        ],
      },
      include: {
        items: {
          include: {
            book: true,
          },
        },
      },
    });
  }

  if (!order) {
    notFound();
  }

  return (
    <SuccessClient
      order={order}
      reference={searchParams.reference || searchParams.trxref || undefined}
      sessionId={searchParams.session_id}
      provider={searchParams.provider}
    />
  );
}

