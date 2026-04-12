import { Card } from "@/components/Card";
import { LoadingBlock } from "@/components/LoadingBlock";

export function PageLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <LoadingBlock className="h-4 w-32" />
        <LoadingBlock className="h-10 w-80 max-w-full" />
        <LoadingBlock className="h-4 w-[30rem] max-w-full" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <div className="space-y-4">
              <LoadingBlock className="h-4 w-24" />
              <LoadingBlock className="h-10 w-36" />
              <LoadingBlock className="h-3 w-44" />
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="space-y-4">
          <LoadingBlock className="h-10 w-full" />
          {Array.from({ length: 5 }).map((_, index) => (
            <LoadingBlock key={index} className="h-14 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
}
