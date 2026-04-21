import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import EnglishHomePage from "./pages/EnglishHomePage";
import TagPage from "./pages/TagPage";
import ArtworkTagPage from "./pages/ArtworkTagPage";
import GamesPage from "./pages/GamesPage";

const PostPage = lazy(() => import("./PostPage"));
const ArtPage = lazy(() => import("./pages/ArtPage"));
const ArtworkDetailPage = lazy(() => import("./pages/ArtworkDetailPage"));

function App() {
  return (
    <Suspense fallback={<div className="route-loading" aria-hidden="true" />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/en" element={<EnglishHomePage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/art" element={<ArtPage />} />
        <Route path="/art/tag/:tagName" element={<ArtworkTagPage />} />
        <Route path="/art/:slug" element={<ArtworkDetailPage />} />
        <Route path="/post/:slug" element={<PostPage language="zh" />} />
        <Route path="/en/post/:slug" element={<PostPage language="en" />} />
        <Route path="/tag/:tagName" element={<TagPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
