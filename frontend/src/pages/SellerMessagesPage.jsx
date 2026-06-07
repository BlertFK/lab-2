import MessagesPage from "./MessagesPage";

export default function SellerMessagesPage({ user, setPage, setRootPage, onLogout, showToast }) {
  return (
    <MessagesPage
      user={user}
      setPage={setPage}
      setRootPage={setRootPage}
      onLogout={onLogout}
      showToast={showToast}
      role="seller"
    />
  );
}
