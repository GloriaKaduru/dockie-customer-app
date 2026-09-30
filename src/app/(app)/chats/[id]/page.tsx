import { ChatsView } from "@/components/chats/chats-view";

export const metadata = { title: "Chats" };

// /chats/new starts a fresh conversation; /chats/c1 opens a saved one.
export default async function ChatPage({ params }: PageProps<"/chats/[id]">) {
  const { id } = await params;
  return <ChatsView activeId={id} />;
}
