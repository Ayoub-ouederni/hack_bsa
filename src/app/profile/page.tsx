"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  Copy,
  Check,
  Shield,
  Crown,
  Coins,
  ExternalLink,
  Hexagon,
  Pencil,
  Save,
  X,
} from "lucide-react";

import { useWallet } from "@/lib/hooks/useWallet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface Membership {
  id: string;
  fundId: string;
  fundName: string;
  fundDescription: string | null;
  fundWalletAddress: string;
  isOrganizer: boolean;
  displayName: string;
  totalContributed: number;
  nftTokenId: string | null;
  joinedAt: string;
}

interface ProfileData {
  walletAddress: string;
  displayName: string | null;
  bio: string | null;
  avatarBase64: string | null;
}

export default function ProfilePage() {
  const { address, isConnected, isConnecting } = useWallet();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/profile?wallet=${address}`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data.profile);
      setMemberships(data.memberships);
      setEditName(data.profile.displayName ?? "");
      setEditBio(data.profile.bio ?? "");
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      fetchProfile();
    }
  }, [isConnected, address, fetchProfile]);

  const handleSave = async () => {
    if (!address) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          displayName: editName || null,
          bio: editBio || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditing(false);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !address) return;

    if (file.size > 500_000) {
      alert("Image too large. Max 500KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: address,
            avatarBase64: base64,
          }),
        });
        if (!res.ok) throw new Error("Failed to upload avatar");
        const updated = await res.json();
        setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
      } catch (err) {
        console.error("Failed to upload avatar:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const dropsToXrp = (drops: number) => (drops / 1_000_000).toFixed(2);

  // Not connected state
  if (!isConnecting && !isConnected) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF9E6]">
            <Shield className="h-8 w-8 text-[#F5A623]" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-[#1A1A2E]">Connect Your Wallet</h1>
            <p className="text-[#6B7280]">
              Connect your wallet to view your profile and memberships.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/")}>
            Go Home
          </Button>
        </div>
    );
  }

  return (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-8"
      >
        {/* Back navigation */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Profile Header Card */}
        <Card className="relative overflow-hidden">
          {/* Decorative gradient bar */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-[#FFF9E6] via-[#FFF9E6]/50 to-transparent" />

          <CardContent className="relative pt-8 pb-6">
            {loading ? (
              <div className="flex items-start gap-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-72" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start gap-6">
                {/* Avatar with upload */}
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    {profile?.avatarBase64 ? (
                      <AvatarImage src={profile.avatarBase64} alt="Profile" />
                    ) : null}
                    <AvatarFallback className="bg-[#FFF9E6] text-primary text-2xl font-bold">
                      {(profile?.displayName?.[0] ?? address?.[0] ?? "?").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Camera className="h-6 w-6 text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>

                {/* Profile Info */}
                <div className="flex-1 min-w-0 space-y-3">
                  <AnimatePresence mode="wait">
                    {editing ? (
                      <motion.div
                        key="editing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="displayName">Display Name</Label>
                          <Input
                            id="displayName"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Enter your name"
                            maxLength={50}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={editBio}
                            onChange={(e) => setEditBio(e.target.value)}
                            placeholder="Tell the community about yourself..."
                            maxLength={300}
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={saving}
                            className="gap-2"
                          >
                            <Save className="h-3.5 w-3.5" />
                            {saving ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditing(false);
                              setEditName(profile?.displayName ?? "");
                              setEditBio(profile?.bio ?? "");
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="viewing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center gap-3">
                          <h1 className="text-2xl font-bold truncate">
                            {profile?.displayName || "Anonymous"}
                          </h1>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => setEditing(true)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                        {profile?.bio && (
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {profile.bio}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Wallet address */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Wallet</span>
                    <button
                      onClick={copyAddress}
                      className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-mono transition-colors hover:bg-muted/80"
                      title={address ?? ""}
                    >
                      {address
                        ? `${address.slice(0, 6)}…${address.slice(-4)}`
                        : ""}
                      {copied ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 pt-1">
                    <div className="text-sm">
                      <span className="font-semibold text-foreground">
                        {memberships.length}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {memberships.length === 1 ? "fund" : "funds"}
                      </span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="text-sm">
                      <span className="font-semibold text-foreground">
                        {memberships.filter((m) => m.nftTokenId).length}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {memberships.filter((m) => m.nftTokenId).length === 1
                          ? "NFT"
                          : "NFTs"}
                      </span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="text-sm">
                      <span className="font-semibold text-foreground">
                        {dropsToXrp(
                          memberships.reduce(
                            (sum, m) => sum + m.totalContributed,
                            0
                          )
                        )}
                      </span>{" "}
                      <span className="text-muted-foreground">XRP contributed</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs: Memberships & NFTs */}
        <Tabs defaultValue="memberships" className="space-y-4">
          <TabsList>
            <TabsTrigger value="memberships" className="gap-2">
              <Shield className="h-4 w-4" />
              Memberships
            </TabsTrigger>
            <TabsTrigger value="nfts" className="gap-2">
              <Hexagon className="h-4 w-4" />
              NFTs
            </TabsTrigger>
          </TabsList>

          {/* Memberships Tab */}
          <TabsContent value="memberships" className="space-y-3">
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : memberships.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-4 py-12">
                  <Shield className="h-10 w-10 text-gray-300" />
                  <div className="text-center">
                    <p className="font-medium">No memberships yet</p>
                    <p className="text-sm text-muted-foreground">
                      Join a fund to get started.
                    </p>
                  </div>
                  <Link
                    href="/onboarding"
                    className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    Join a Fund
                  </Link>
                </CardContent>
              </Card>
            ) : (
              memberships.map((m, idx) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link href={`/fund/${m.fundId}`}>
                    <Card className="group transition-colors hover:bg-[#FFF9E6]/50 cursor-pointer">
                      <CardContent className="flex items-center gap-4 py-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#FFF9E6] text-primary font-bold text-lg">
                          {m.fundName[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">
                              {m.fundName}
                            </h3>
                            {m.isOrganizer && (
                              <Badge
                                variant="secondary"
                                className="gap-1 text-xs"
                              >
                                <Crown className="h-3 w-3" />
                                Organizer
                              </Badge>
                            )}
                            {m.nftTokenId && (
                              <Badge
                                variant="outline"
                                className="gap-1 text-xs"
                              >
                                <Hexagon className="h-3 w-3" />
                                NFT
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Coins className="h-3 w-3" />
                              {dropsToXrp(m.totalContributed)} XRP
                            </span>
                            <span>
                              Joined{" "}
                              {new Date(m.joinedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* NFTs Tab */}
          <TabsContent value="nfts" className="space-y-3">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="py-6">
                      <div className="flex flex-col items-center gap-3">
                        <Skeleton className="h-20 w-20 rounded-xl" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              (() => {
                const nftMemberships = memberships.filter(
                  (m) => m.nftTokenId
                );

                if (nftMemberships.length === 0) {
                  return (
                    <Card>
                      <CardContent className="flex flex-col items-center gap-4 py-12">
                        <Hexagon className="h-10 w-10 text-gray-300" />
                        <div className="text-center">
                          <p className="font-medium">No membership NFTs yet</p>
                          <p className="text-sm text-muted-foreground">
                            Your soulbound membership NFTs will appear here
                            when you join funds.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }

                return (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {nftMemberships.map((m, idx) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.08 }}
                      >
                        <Card className="group relative overflow-hidden">
                          {/* Gradient background */}
                          <div className="absolute inset-0 bg-gradient-to-br from-[#FFF9E6]/50 via-transparent to-[#FFF9E6]/30 opacity-0 transition-opacity group-hover:opacity-100" />

                          <CardHeader className="relative pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">
                                {m.fundName}
                              </CardTitle>
                              {m.isOrganizer && (
                                <Crown className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                          </CardHeader>

                          <CardContent className="relative space-y-4">
                            {/* NFT Visual */}
                            <div className="flex items-center justify-center py-4">
                              <div className="relative">
                                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFF9E6] to-[#FFF9E6]/50 border border-[#F5A623]/20 shadow-inner">
                                  <Hexagon className="h-10 w-10 text-primary" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 shadow-sm">
                                  <Check className="h-3.5 w-3.5 text-white" />
                                </div>
                              </div>
                            </div>

                            <Separator />

                            {/* NFT Details */}
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Type
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  Soulbound
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Token ID
                                </span>
                                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                                  {m.nftTokenId!.slice(0, 8)}...
                                  {m.nftTokenId!.slice(-6)}
                                </code>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Minted
                                </span>
                                <span>
                                  {new Date(m.joinedAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Contributed
                                </span>
                                <span className="font-medium">
                                  {dropsToXrp(m.totalContributed)} XRP
                                </span>
                              </div>
                            </div>

                            {/* View fund link */}
                            <Link
                              href={`/fund/${m.fundId}`}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              View Fund
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                );
              })()
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
  );
}
