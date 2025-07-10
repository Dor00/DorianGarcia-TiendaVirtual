// lib/apolloClient.ts
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

let apolloClient: ApolloClient<any> | null = null;

const createApolloClient = () => {
  return new ApolloClient({
    ssrMode: typeof window === 'undefined', // Set to true for SSR
    link: new HttpLink({
      uri: '/api/graphql', // Este es el endpoint de tu servidor GraphQL en Next.js
    }),
    cache: new InMemoryCache(),
  });
};

export function initializeApollo(initialState = null) {
  const _apolloClient = apolloClient ?? createApolloClient();

  // If your page has Next.js data fetching methods that use Apollo Client,
  // the initial state gets hydrated here
  if (initialState) {
    _apolloClient.cache.restore(initialState);
  }
  // For SSG and SSR always create a new Apollo Client
  if (typeof window === 'undefined') return _apolloClient;
  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient;

  return _apolloClient;
}
