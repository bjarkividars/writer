import Workspace from "@/components/Workspace";
import { headers } from "next/headers";
import { isMobileUserAgent } from "@/lib/device";

export default async function SessionPage() {
  const userAgent = (await headers()).get("user-agent");
  return <Workspace initialIsMobile={isMobileUserAgent(userAgent)} />;
}
