"use client";

import { useState } from "react";
import { Loader2, Zap } from "lucide-react";
import { createClient } from "@/libs/supabase/client";
import apiClient from "@/libs/api";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// This component is used to create Stripe Checkout Sessions
// It calls the /api/stripe/create-checkout route with the priceId, successUrl and cancelUrl
// Users must be authenticated. It will prefill the Checkout data with their email and/or credit card (if any)
// You can also change the mode to "subscription" if you want to create a subscription instead of a one-time payment
const ButtonCheckout = ({
  priceId,
  mode = "subscription",
}: {
  priceId: string;
  mode?: "payment" | "subscription";
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const handlePayment = async () => {
    setIsLoading(true);

    try {
      // Check if user is authenticated
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Redirect to signin with return URL
        router.push(`/signin?redirect=${encodeURIComponent(window.location.pathname)}`);
        setIsLoading(false);
        return;
      }

      const { url }: { url: string } = await apiClient.post(
        "/stripe/create-checkout",
        {
          priceId,
          successUrl: `${window.location.origin}/onboarding`,
          cancelUrl: window.location.href,
          mode,
        }
      );

      window.location.href = url;
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  return (
    <Button
      className="w-full text-xs cursor-pointer"
      onClick={() => handlePayment()}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <Zap className="mr-2 h-4 w-4" />
          Get Started
        </>
      )}
    </Button>
  );
};

export default ButtonCheckout;
