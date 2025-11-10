// ABOUTME: Modal component for viewing user avatars in full size
// ABOUTME: Displays avatar image with close button and click-outside-to-close functionality

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AvatarViewModalProps {
  open: boolean
  onClose: () => void
  avatarUrl?: string | null
  userName: string
}

export function AvatarViewModal({ open, onClose, avatarUrl, userName }: AvatarViewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="relative">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Avatar image */}
          <div className="flex items-center justify-center bg-gradient-to-br from-muted to-background p-8">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            ) : (
              <Avatar className="h-64 w-64">
                <AvatarImage src={avatarUrl || undefined} alt={userName} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-6xl">
                  {userName?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
