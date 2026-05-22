import { Button } from "@/components/ui/button"
import { Plus, CreditCardIcon } from "lucide-react"
import { getLoyaltyCards, createLoyaltyCard } from "@/app/actions/loyalty-actions"
import { Input } from "@/components/ui/input"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet"
import { ActionForm } from "@/components/admin/ActionForm"
import { LoyaltyCardTableClient } from "./LoyaltyCardTableClient"

export default async function LoyaltyCardsPage() {
  const { cards, success } = await getLoyaltyCards()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CreditCardIcon className="w-6 h-6 text-[#4F46E5]" /> Хөнгөлөлтийн карт
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Хэрэглэгчийн хөнгөлөлтийн картуудыг бүртгэх болон удирдах.
          </p>
        </div>
        <Sheet>
          <SheetTrigger className="inline-flex items-center justify-center rounded-lg bg-[#4F46E5] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-[#4338ca] transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            Карт үүсгэх
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Шинэ карт бүртгэх</SheetTitle>
            </SheetHeader>
            <ActionForm action={async (formData) => {
              "use server"
              const cardNumber = formData.get("cardNumber") as string;
              const phone = formData.get("phone") as string;
              const pointsBalance = formData.get("pointsBalance") as string;
              if (cardNumber) return await createLoyaltyCard({ cardNumber, phone, pointsBalance: parseInt(pointsBalance) || 0 });
              return { success: false, error: "Картын дугаар оруулна уу" }
            }} className="space-y-4 mt-6" successMessage="Карт үүсгэлээ">
              <div className="space-y-2">
                <label htmlFor="cardNumber" className="text-sm font-medium">Картын дугаар *</label>
                <Input id="cardNumber" name="cardNumber" required placeholder="Ж: 0001" />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">Утасны дугаар (Заавал биш)</label>
                <Input id="phone" name="phone" placeholder="Ж: 99112233" />
              </div>
              <div className="space-y-2">
                <label htmlFor="pointsBalance" className="text-sm font-medium">Анхны оноо (Заавал биш)</label>
                <Input id="pointsBalance" name="pointsBalance" type="number" defaultValue="0" />
              </div>
              <Button type="submit" className="w-full bg-[#4F46E5] text-white hover:bg-[#4338ca]">Үүсгэх</Button>
            </ActionForm>
          </SheetContent>
        </Sheet>
      </div>

      <LoyaltyCardTableClient cards={success ? cards : []} />
    </div>
  )
}
