"use client"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"
import Link from "next/link"
import { ArrowLeft, Upload, ImageIcon, Loader2, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { UseFormReturn } from "react-hook-form"

interface CreateCoinFormProps {
  form: UseFormReturn<{
    name: string
    symbol: string
    description?: string | undefined
    image_url?: string | undefined
  }>
  onSubmit: (values: any) => Promise<void>
  isCreateCoinLoading: boolean
  isConnected: boolean
  walletClient: any
}

export function CreateCoinForm({
  form,
  onSubmit,
  isCreateCoinLoading,
  isConnected,
  walletClient
}: CreateCoinFormProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button 
                variant="ghost" 
                size="sm" 
                className={getMetalClassName('silver', 'static', 'flex items-center gap-2')}
                style={getMetalStyle('silver')}
              >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Info Alert */}
          <Alert className={`mb-6 border-blue-200 ${getMetalClassName('pearl', 'static', '')}`} style={getMetalStyle('pearl')}>
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Zora Deployment:</strong> Each coin is deployed as an ERC-20 token on the Zora protocol on Base. 
              You need to connect your wallet to deploy your coin. Only one coin per Farcaster user is allowed.
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="space-y-6">
                  <Card className={getMetalClassName('pearl', 'static', '')} style={getMetalStyle('pearl')}>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Coin Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., My Awesome Coin" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="symbol"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Symbol *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., MAC"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                maxLength={10}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe your coin..." rows={4} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card className={getMetalClassName('pearl', 'static', '')} style={getMetalStyle('pearl')}>
                    <CardHeader>
                      <CardTitle>Coin Image</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="image_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://gmonchain.xyz/image.png" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        className={getMetalClassName('chrome', 'static', 'w-full')}
                        style={getMetalStyle('chrome')}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Preview Section */}
                <div className="space-y-6">
                  <Card className={getMetalClassName('pearl', 'static', '')} style={getMetalStyle('pearl')}>
                    <CardHeader>
                      <CardTitle>Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {form.watch("name") || form.watch("symbol") ? (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                            <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                              {form.watch("image_url") ? (
                                <img
                                  src={form.watch("image_url") || "/placeholder.svg"}
                                  alt="Coin"
                                  className="w-full h-full object-cover rounded-lg"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = "none"
                                    const parent = target.parentElement
                                    if (parent) {
                                      parent.innerHTML = `<span class="text-white font-bold text-xl">${form.watch("symbol")?.charAt(0) || "?"}</span>`
                                    }
                                  }}
                                />
                              ) : (
                                <span className="text-white font-bold text-xl">
                                  {form.watch("symbol")?.charAt(0) || "?"}
                                </span>
                              )}
                            </div>
                            <div className="flex-grow">
                              <h3 className="font-bold text-lg">{form.watch("name") || "Coin Name"}</h3>
                              <p className="text-gray-500">${form.watch("symbol") || "SYMBOL"}</p>
                            </div>
                          </div>
                          {form.watch("description") && (
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-600">{form.watch("description")}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                          <p>Fill in the form to see preview</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Button
                    type="submit"
                    disabled={
                      isCreateCoinLoading || 
                      !form.watch("name") || 
                      !form.watch("symbol") ||
                      !isConnected ||
                      !walletClient
                    }
                    className={getMetalClassName('gold', 'animated', 'w-full text-lg py-6 border border-yellow-400')}
                    style={getMetalStyle('gold')}
                    size="lg"
                  >
                    {isCreateCoinLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Deploying to Zora...
                      </>
                    ) : !isConnected ? (
                      "Connect Wallet to Create Coin"
                    ) : (
                      "Deploy Coin to Zora"
                    )}
                  </Button>

                  {!isConnected && (
                    <div className="text-center mt-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        You need to connect your wallet to deploy coins to Zora
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
} 