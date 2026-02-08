 "use client"

 import React from "react"
 import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

 let queryClient: QueryClient | null = null

 function getClient() {
   if (!queryClient) {
     queryClient = new QueryClient({
       defaultOptions: {
         queries: {
           retry: 1,
           staleTime: 1000 * 30,
           refetchOnWindowFocus: false,
         },
       },
     })
   }
   return queryClient
 }

 export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
   const client = React.useMemo(getClient, [])
   return <QueryClientProvider client={client}>{children}</QueryClientProvider>
 }

