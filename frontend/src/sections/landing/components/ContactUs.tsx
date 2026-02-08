import React, { useState } from "react"
import { Mail, MessageCircle, Send, User } from "lucide-react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

const WEB3FORMS_ACCESS_KEY = "dc14701b-1db1-423f-b50e-c2b8b5546af8"

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatusMessage("")
    const data = {
      access_key: WEB3FORMS_ACCESS_KEY,
      ...formData,
    }
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      if (result.success) {
        setStatusMessage("Message sent successfully. Thanks for reaching out.")
        setFormData({ name: "", email: "", message: "" })
      } else {
        setStatusMessage(`Failed to send message: ${result.message || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setStatusMessage("Failed to send message. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section-padding section-space" id="contact">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Contact</p>
              <h2 className="font-heading text-3xl font-semibold text-slate-900 sm:text-4xl">Let’s build a smoother marketplace together.</h2>
            <p className="text-sm text-muted-foreground">
              Share feedback, request features, or ask about partnerships. Our team will respond quickly.
            </p>
            <div className="grid gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-emerald-600" />
                support@burhanpedia.com
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="size-4 text-blue-600" />
                Response time under 24 hours
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="rounded-3xl border border-border/70 bg-white p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-slate-900">Send a message</h3>
            <p className="mb-5 text-xs text-muted-foreground">We will get back to you with updates and next steps.</p>
            <form onSubmit={sendEmail} className="space-y-4">
              <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-slate-50 px-3 py-2">
                <User className="size-4 text-muted-foreground" />
                <Input
                  name="name"
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0"
                />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-slate-50 px-3 py-2">
                <Mail className="size-4 text-muted-foreground" />
                <Input
                  name="email"
                  type="email"
                  placeholder="Your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0"
                />
              </div>
              <div className="rounded-2xl border border-border/70 bg-slate-50 px-3 py-2">
                <Textarea
                  name="message"
                  placeholder="Tell us how we can help"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="resize-none border-0 bg-transparent px-0 focus-visible:ring-0"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full gap-2">
                <Send className="size-4" />
                {loading ? "Sending..." : "Send message"}
              </Button>
              {statusMessage && (
                <p className="text-center text-xs text-muted-foreground">{statusMessage}</p>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
