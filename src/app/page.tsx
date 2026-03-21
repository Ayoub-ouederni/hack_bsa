import { Heart } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="flex items-center gap-3">
        <Heart className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight">Pulse</h1>
      </div>
      <p className="max-w-md text-center text-lg text-muted-foreground">
        Community emergency fund on the XRP Ledger
      </p>
    </div>
  );
}
