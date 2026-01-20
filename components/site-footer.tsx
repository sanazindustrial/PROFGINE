export function SiteFooter() {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-center text-sm text-muted-foreground md:text-left">
            Copyright © 2026 Professor GENIE Platform. All rights reserved.
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="/docs" className="hover:text-foreground transition-colors">
              Docs
            </a>
            <a href="/help" className="hover:text-foreground transition-colors">
              Help
            </a>
            <a href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
