"use client";

import { useRef } from "react";
import { useEditor } from "@tiptap/react";
import Sidebar from "@/components/sidebar/Sidebar";
import SidebarToggle from "@/components/sidebar/SidebarToggle";
import FloatingThemeMenu from "@/components/sidebar/FloatingThemeMenu";
import Header from "@/components/header/Header";
import { SessionProvider } from "@/components/session/SessionContext";
import { LoadingProvider, useLoadingContext } from "@/components/LoadingProvider";
import { EditorProvider } from "@/components/editor/EditorContext";
import { ChatProvider } from "@/components/chat/ChatContext";
import { ChatPanelProvider } from "@/components/chat/ChatPanelContext";
import { OnboardingProvider } from "@/components/onboarding/OnboardingContext";
import { editorExtensions } from "@/editor/extensions";

function AppShell({ children }: { children: React.ReactNode }) {
  const { isInitialLoading } = useLoadingContext();
  const editorRootRef = useRef<HTMLDivElement>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions,
    content: "",
    editorProps: {
      attributes: {
        class: "min-h-full w-full outline-none text-base leading-7",
      },
    },
  });

  return (
    <ChatProvider>
      <ChatPanelProvider>
        <EditorProvider editor={editor} editorRootRef={editorRootRef}>
          <div className="h-dvh w-full bg-background">
            <SidebarToggle />
            <FloatingThemeMenu />
            <div className="h-full flex">
              <Sidebar />
              <div className="flex-1 flex flex-col shadow-doc-left relative z-10">
                {!isInitialLoading && <Header />}
                <main className="flex-1 overflow-hidden">{children}</main>
              </div>
            </div>
          </div>
        </EditorProvider>
      </ChatPanelProvider>
    </ChatProvider>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <OnboardingProvider>
        <LoadingProvider>
          <AppShell>{children}</AppShell>
        </LoadingProvider>
      </OnboardingProvider>
    </SessionProvider>
  );
}
