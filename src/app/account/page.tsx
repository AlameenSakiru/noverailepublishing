import { Metadata } from "next";
import { AccountClient } from "./AccountClient";

export const metadata: Metadata = {
  title: "My Account & Security | Noveraile Publishing",
  description: "Manage your personal profile, credentials, and active security sessions.",
};

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <AccountClient />
    </div>
  );
}
