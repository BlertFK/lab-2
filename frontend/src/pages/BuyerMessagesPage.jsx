import MessagesPage from "./MessagesPage";

export default function BuyerMessagesPage({ user, setPage, setRootPage, onLogout, showToast }) {
  return (
    <MessagesPage
      user={user}
      setPage={setPage}
      setRootPage={setRootPage}
      onLogout={onLogout}
      showToast={showToast}
      role="buyer"
    />
  );
}
