export const ChatSidebar = () => {
  const chats = [
    { id: "1", title: "Welcome to AI", last: "Start a conversation…" },
    {
      id: "2",
      title: "How to use AI features",
      last: "Let me help you with that...",
    },
    {
      id: "3",
      title: "Creative writing assistance",
      last: "I can help you write stories...",
    },
    {
      id: "4",
      title: "Code debugging help",
      last: "Let's fix that error together...",
    },
    {
      id: "5",
      title: "Recipe suggestions",
      last: "What ingredients do you have?",
    },
  ];

  return (
    <aside className="hidden md:flex w-[300px] shrink-0 flex-col rounded-2xl border border-slate-200 bg-white/80 backdrop-blur shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-3">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-purple-600"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
              fill="currentColor"
            />
          </svg>
          <div className="text-sm font-semibold tracking-tight">AI</div>
        </div>
        <a
          href="/chat"
          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-purple-700 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          New
        </a>
      </div>

      <div className="m-2 mb-3 space-y-2 overflow-y-auto">
        {chats.map((chat) => (
          <a
            key={chat.id}
            href={`/chat/${chat.id}`}
            className="group block cursor-pointer rounded-xl border border-transparent px-3 py-2 transition-colors hover:border-slate-200 hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-100 text-purple-700">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 4H4a2 2 0 00-2 2v10a2 2 0 002 2h3.5l3.6 2.7c.8.6 1.9 0 1.9-.9V18H20a2 2 0 002-2V6a2 2 0 00-2-2z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{chat.title}</div>
                <div className="truncate text-xs text-slate-500">
                  {chat.last}
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </aside>
  );
};
