import { CompareProvider } from "@/components/catalog/CompareProvider";
import { CompareTray } from "@/components/catalog/CompareTray";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      <CompareProvider>
        {children}
        <CompareTray />
        <Toaster position="top-center" />
      </CompareProvider>
    </TooltipProvider>
  );
}
