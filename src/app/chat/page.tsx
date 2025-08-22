import { WelcomeForm } from "@/components/chat/welcome";

export default function ChatPage() {
  return (
    <section className="flex h-full flex-col">
      <div className="flex-1 px-8 py-3">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg">
              <svg
                className="h-10 w-10 text-featured-text"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-3">Hello! 👋</h2>
          <p className="text-slate-600 mb-8 text-lg">
            I'm NORA, your intelligent assistant. How can I help you today?
          </p>

          <WelcomeForm />
        </div>
      </div>
    </section>
  );
}
