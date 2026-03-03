import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
        <Construction className="w-8 h-8 text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>
      <p className="text-sm text-muted-foreground bg-muted px-4 py-2 rounded-full">
        即将推出 · Coming Soon
      </p>
    </div>
  );
}
