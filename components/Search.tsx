import { Input } from "@/components/ui/input"
import { AlertTriangle, SearchIcon } from "lucide-react"

import { useState, useEffect, useCallback } from "react"
import { cn, debounce, getNetworkFromAddress } from "@/lib/utils"
import {ContractSearchResponseType } from "@/lib/types"
import { useRouter } from "next/navigation"
import Loading from "./ui/Loading"
import { Card, CardContent, CardHeader } from "./ui/card"
import Link from "next/link"
import SearchDataTable from "./tables/SearchDataTable"
import SkeletonTable from "./tables/SkeletonTable"
import { columns } from "./tables/SearchContractTableColumns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import TopContractsTable from "./tables/TopContractsTable"
import { Button } from "./ui/button"

export function Search() {
  const [ query, setQuery ] = useState("")
  const [ network, setNetwork ] = useState("mainnet")
  const [ contractResultsMainnet, setContractResultsMainnet ] = useState({} as ContractSearchResponseType)
  const [ contractResultsTestnet, setContractResultsTestnet ] = useState({} as ContractSearchResponseType)
  const [ loading, setLoading ] = useState(false)
  const [ loadingMainnetResults, setLoadingMainnetResults ] = useState(false)
  const [ loadingTestnetResults, setLoadingTestnetResults ] = useState(false)

  const [ offset, setOffset ] = useState(0)
  const [ limit, setLimit ] = useState(50)

  const router = useRouter()

  const getResults = useCallback(
    debounce(async (query) => {

      setLoading(true)
      setLoadingMainnetResults(true)
      setLoadingTestnetResults(true)

      console.log("fetching search results")

      const reqMainnet = fetch(`${process.env.NEXT_PUBLIC_BASE_DOMAIN}/api/search/contracts?network=mainnet&query=${query}&offset=${offset}&limit=${limit}`)
        .then((res) => res.json())
        .then((res) => {
          setLoadingMainnetResults(false)
          setContractResultsMainnet(res)
        })

      const reqTestnet = fetch(`${process.env.NEXT_PUBLIC_BASE_DOMAIN}/api/search/contracts?network=testnet&query=${query}&offset=${offset}&limit=${limit}`)
        .then((res) => res.json())
        .then((res) => {
          setLoadingTestnetResults(false)
          setContractResultsTestnet(res)
        })

    }, 500),[])

  useEffect(() => {
    if(query.length > 2){

      setLoading(true)

      switch(true) {
        case /^(?:0x)?[0-9a-fA-F]{8,16}$/.test(query):
          // Account search
          setLoading(false)
          setQuery("")
          return router.push(`/account/${query}`);
        case /^(?:A\.)?[0-9a-fA-F]{8,16}\.[\w-]+$/.test(query):
          // Contract search
          setLoading(false)
          setQuery("")
          return router.push(`/${query}`);
        default:
          break;
      }
      getResults(query)
    }

    return () => {
      setLoading(false)
    }
  }, [query, offset, limit])

  return (
    <div className="relative flex items-center w-full">
      <SearchIcon className={cn("h-6 w-6 text-muted-foreground absolute left-4")} />
      {/* <SearchIcon className={cn("h-6 w-6 text-muted-foreground absolute left-4", query.length > 2 || loading ? "hidden": "")} /> */}
      {/* <Loading className={cn("w-6 h-6 absolute left-4 top-4", loading ? "": "hidden")} /> */}
      <Input
          type="search"
          placeholder="Search contracts, addresses and more"
          className="w-full h-14 text-lg ps-14"
          value={query}
          onChange={(e) => { setQuery(e.target.value)}}
        />

      {query.length > 2 || loading ? (
      <Card className="min-h-[200px] max-h-[80vh] shadow-2xl absolute overflow-auto w-full top-[50px] z-10 px-2 rounded-t-none">
        <CardHeader>
          <h3 className="text-lg font-bold flex items-center justify-between">
            <span>Search Results</span>
            <span className="text-muted-foreground">{(contractResultsMainnet?.data?.total_contracts_count || 0) + (contractResultsTestnet?.data?.total_contracts_count || 0)} results</span>
          </h3>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="mainnet" className="space-y-4">
            <div className="flex">
            <TabsList>
              <TabsTrigger value="mainnet" onClick={() => setNetwork("mainnet")}>Mainnet ({contractResultsMainnet?.data?.total_contracts_count})</TabsTrigger>
              <TabsTrigger value="testnet" onClick={() => setNetwork("testnet")}>Testnet ({contractResultsTestnet?.data?.total_contracts_count})</TabsTrigger>
            </TabsList>
            <span className={`flex gap-2 ms-4 items-center text-xs text-muted-foreground ${network !== 'testnet' ? 'hidden' : null}`}><AlertTriangle className="h-4 w-4"/>Note: Testnet API is slower</span>
            </div>

            <TabsContent value="mainnet" className="space-y-4">
              <h3 className="text-sm uppercase font-bold flex items-center justify-between mb-2">
                <span>Mainnet Contracts</span>
                <span className="text-muted-foreground">{contractResultsMainnet?.data?.total_contracts_count || 0} results</span>
              </h3>
              {loadingMainnetResults ? <Loading className="w-6 h-6 block mx-auto my-16" /> : null}
              {contractResultsMainnet && contractResultsMainnet?.data?.contracts?.length && contractResultsMainnet?.data?.contracts?.length  > 0 ?
              <SearchDataTable columns={columns} data={contractResultsMainnet?.data?.contracts} /> : <SkeletonTable numCols={3} numRows={10} />}
            </TabsContent>
            <TabsContent value="testnet" className="space-y-4">
              <h3 className="text-sm uppercase font-bold flex items-center justify-between mt-4 mb-2">
                <span>Testnet Contracts</span>
                <span className="text-muted-foreground">{contractResultsTestnet?.data?.total_contracts_count || 0} results</span>
              </h3>
              {loadingTestnetResults ? <Loading className="w-6 h-6 block mx-auto my-16" /> : null}
              {contractResultsTestnet && contractResultsTestnet?.data?.contracts?.length && contractResultsTestnet?.data?.contracts?.length  > 0 ?
              <SearchDataTable data={contractResultsTestnet?.data?.contracts} columns={columns}/>
              : <div className={cn("text-sm block pt-4 pb-8 text-muted-foreground", loadingTestnetResults ? "hidden" : "")}>No results.</div>
              }
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      ): null}
      
    </div>

  )
}