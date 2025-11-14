'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'
import { Button } from '@workspace/ui/components/button'

interface SuccessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  guessCount: number
  onPlayAgain: () => void
}

export function SuccessModal({ open, onOpenChange, guessCount, onPlayAgain }: SuccessModalProps) {
  const handlePlayAgain = () => {
    onPlayAgain()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-green-600">
            🎉 Congratulations!
          </DialogTitle>
          <DialogDescription className="text-lg pt-2">
            You solved it in {guessCount} {guessCount === 1 ? 'guess' : 'guesses'}!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handlePlayAgain} size="lg" className="w-full">
            Play Again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
