import { useEffect, useState } from "react";
import { fetchPublishedArtworks } from "../../lib/artworks";
import { fetchPublishedFriendArticles } from "../../lib/friendArticles";
import { fetchPublishedGames, pickWeightedRandomGame } from "../../lib/games";
import { fetchPublishedPosts } from "../../lib/posts";
import type { Artwork } from "../../types/artwork";
import type { FriendArticle } from "../../types/friendArticle";
import type { Game } from "../../types/game";
import type { Post } from "../../types/post";

function useHomeData() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [friendArticles, setFriendArticles] = useState<FriendArticle[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [featuredGame, setFeaturedGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      const [
        { data: postData, error: postError },
        friendArticleData,
        { data: artworkData, error: artworkError },
        { data: gameData, error: gameError },
      ] = await Promise.all([
        fetchPublishedPosts(),
        fetchPublishedFriendArticles(),
        fetchPublishedArtworks(),
        fetchPublishedGames(),
      ]);

      if (postError) {
        console.error(postError);
      } else {
        setPosts(postData ?? []);
      }

      if (artworkError) {
        console.error(artworkError);
      } else {
        setArtworks(artworkData ?? []);
      }

      setFriendArticles(friendArticleData.data ?? []);

      if (friendArticleData.error) {
        console.error(friendArticleData.error);
      }

      if (gameError) {
        console.error(gameError);
      } else {
        const publishedGames = gameData ?? [];
        setGames(publishedGames);
        setFeaturedGame(pickWeightedRandomGame(publishedGames));
      }

      setLoading(false);
    };

    void loadHomeData();
  }, []);

  const refreshFeaturedGame = () => {
    setFeaturedGame((currentGame) =>
      pickWeightedRandomGame(games, currentGame?.id),
    );
  };

  return {
    artworks,
    featuredGame,
    friendArticles,
    games,
    loading,
    posts,
    refreshFeaturedGame,
  };
}

export default useHomeData;
