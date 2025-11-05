import Link from "next/link";
import { Sparkles } from "lucide-react";
import ButtonSignin from "@/components/ButtonSignin";
import config from "@/config";

export function SimpleHeader() {
  return (
    <header className="border-b border-base-300 bg-base-100/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">{config.appName}</span>
        </Link>
        <ButtonSignin text="Sign In" />
      </div>
    </header>
  );
}
