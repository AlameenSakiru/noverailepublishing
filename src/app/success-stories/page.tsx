import React from "react";
import { SuccessStoriesClient } from "./SuccessStoriesClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Success Stories & Verified Candidate Pass Rates | Noveraile Publishing",
  description:
    "Explore verified examination outcomes, first-time pass rates, and authentic reader reviews from candidates and readers using Noveraile Publishing and Scholarforge ED. digital editions.",
};

export default function SuccessStoriesPage() {
  return <SuccessStoriesClient />;
}
