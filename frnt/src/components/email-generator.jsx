import { GoogleGenerativeAI } from "@google/generative-ai"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, Copy, Check, Upload, Sparkles, RefreshCw, Download, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
import EmailPreview from "@/components/email-preview"
import { templates, colorThemes } from "@/lib/email-data"
import { toast } from "react-hot-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Initialize the Gemini API with your API key
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyBfnLaGKASmYcczhMHkLo8hIeh-nrCbclM")
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

export default function EmailGenerator() {
  const [formData, setFormData] = useState({
    emailType: "business",
    companyName: "",
    headerText: "",
    subheaderText: "",
    mainContent: "",
    ctaText: "Learn More",
    ctaUrl: "https://example.com",
    accentColor: "#0ea5e9",
    logoUrl: "",
    footerText: "",
  })

  const [generatedEmail, setGeneratedEmail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState(null)
  const [bgImage, setBgImage] = useState(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("design")
  const [logoPreview, setLogoPreview] = useState(null)

  // Set generated email when form data changes to ensure preview updates
  useEffect(() => {
    if (generatedEmail) {
      setGeneratedEmail({
        ...generatedEmail,
        logoUrl: formData.logoUrl
      });
    }
  }, [formData.logoUrl]);

  // Handle input changes for all form fields
  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 2MB.")
        return
      }
  
      // Check file type
      if (!file.type.match("image.*")) {
        toast.error("Invalid file type. Please select an image file.")
        return
      }
  
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          console.log("Image loaded:", event.target.result.toString().substring(0, 50) + "...") 
          setFormData((prev) => ({ ...prev, logoUrl: event.target.result.toString() }))
          setLogoPreview(event.target.result.toString())
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBgUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setBgImage(event.target.result.toString())
          toast.success("Background image uploaded successfully");
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Generate email content using Google Generative AI
  const generateEmail = async () => {
    setLoading(true)
    try {
      const prompt = `
        You are a professional email copywriter with expertise in creating engaging, conversion-optimized email content.
        
        CREATE A ${formData.emailType.toUpperCase()} EMAIL WITH THE FOLLOWING DETAILS:
        
        COMPANY: ${formData.companyName}
        HEADER: ${formData.headerText}
        SUBHEADER: ${formData.subheaderText}
        REQUESTED CONTENT: ${formData.mainContent}
        CALL-TO-ACTION: ${formData.ctaText}
        FOOTER: ${formData.footerText}
        
        GUIDELINES:
        - Write in a professional, engaging tone appropriate for ${formData.emailType} communications
        - Keep paragraphs short and scannable (2-3 sentences max)
        - Include personalized elements and benefit-focused language
        - Create compelling content that drives the reader toward the CTA: "${formData.ctaText}"
        - Include 1-2 relevant bullet points highlighting key benefits or features if appropriate
        - Total length should be 3-4 short paragraphs maximum
        - Do not include any HTML tags or formatting instructions
        - Do not include salutations like "Dear Customer" or signatures
        - Focus on clear, concise messaging that resonates with the target audience
        
        SPECIFIC EMAIL TYPE INSTRUCTIONS:
        ${formData.emailType === "business" ? "Focus on professional tone, business benefits, and ROI. Emphasize credibility and value proposition." : ""}
        ${formData.emailType === "event" ? "Create excitement and urgency. Highlight event details, benefits of attending, and limited availability if applicable." : ""}
        ${formData.emailType === "realestate" ? "Highlight property features, location benefits, and market value. Create a sense of opportunity and exclusivity." : ""}
        ${formData.emailType === "confirmation" ? "Provide clear confirmation details, next steps, and a reassuring tone. Include any important deadlines or requirements." : ""}
        ${formData.emailType === "newsletter" ? "Present information in an engaging, valuable way. Include enticing preview of the main content without exhausting the topic." : ""}
        ${formData.emailType === "welcome" ? "Warm, friendly tone with clear next steps. Express appreciation and set expectations for the relationship moving forward." : ""}
        ${formData.emailType === "product" ? "Focus on unique product benefits, not just features. Address pain points and show how the product solves specific problems." : ""}
        ${formData.emailType === "promotion" ? "Create urgency and excitement. Clearly communicate the offer, any deadlines, and the value proposition of taking immediate action." : ""}
        ${formData.emailType === "thankyou" ? "Express genuine appreciation, reinforce the relationship value, and suggest subtle next steps without being pushy." : ""}
        ${formData.emailType === "holiday" ? "Capture seasonal spirit while remaining professional. Balance warmth with appropriate business context." : ""}
        
        Return only the final email body content.
      `

      const result = await model.generateContent(prompt)
      const response = await result.response
      const generatedContent = response.text()

      // Create a new email object with all current form data
      setGeneratedEmail({
        ...formData,
        mainContent: generatedContent || formData.mainContent,
      })

      setActiveTab("preview")
      toast.success("Email generated successfully!")
    } catch (err) {
      console.error("Error generating email:", err)
      toast.error("Error generating email. Please try again or check your API key.")
    } finally {
      setLoading(false)
    }
  }

  // Reset the form fields and preview output
  const handleReset = () => {
    setFormData({
      emailType: "business",
      companyName: "",
      headerText: "",
      subheaderText: "",
      mainContent: "",
      ctaText: "Learn More",
      ctaUrl: "https://example.com",
      accentColor: "#0ea5e9",
      logoUrl: "",
      footerText: "",
    })
    setGeneratedEmail(null)
    setSelectedTheme(null)
    setBgImage(null)
    setLogoPreview(null)
    setActiveTab("design")

    toast.success("Form reset. All fields have been cleared.")
  }

  const copyHtmlToClipboard = () => {
    if (!generatedEmail) return

    const htmlCode = generateHtmlCode(generatedEmail, selectedTheme)
    navigator.clipboard.writeText(htmlCode)
    setCopied(true)

    toast.success("HTML copied to clipboard. You can now paste it into your email marketing tool.")

    setTimeout(() => setCopied(false), 2000)
  }
  
  // New function for copying rich text format for email clients
  const copyRichTextForEmail = () => {
    if (!generatedEmail) return
    
    // Create a simple rich text version that email clients can handle
    const richTextHtml = generateRichTextForEmailClients(generatedEmail, selectedTheme)
    
    // Create a temporary textarea element to copy the content
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = richTextHtml
    document.body.appendChild(tempDiv)
    
    // Select the content
    const range = document.createRange()
    range.selectNodeContents(tempDiv)
    
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
    
    // Copy the selection
    document.execCommand('copy')
    
    // Clean up
    selection.removeAllRanges()
    document.body.removeChild(tempDiv)
    
    toast.success("Email content copied. You can now paste it directly into Gmail or other email clients.")
  }
  
  // Download the HTML file
  const downloadHtmlFile = () => {
    if (!generatedEmail) return
    
    const htmlCode = generateHtmlCode(generatedEmail, selectedTheme)
    const blob = new Blob([htmlCode], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${formData.emailType}-email-template.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success("HTML file downloaded successfully.")
  }

  // Creates a simplified rich text version that can be pasted into email clients
  const generateRichTextForEmailClients = (data, themeIndex) => {
    const themeColors = themeIndex !== null ? colorThemes[themeIndex] : null
    const primaryColor = themeColors ? themeColors[0] : data.accentColor
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="padding: 30px; background-color: ${
          data.emailType === "business" || data.emailType === "corporate"
            ? "#f7f7f7"
            : data.emailType === "event"
              ? "#f0f9f0"
              : data.emailType === "realestate"
                ? "#fff9f0"
                : data.emailType === "confirmation"
                  ? "#f0f7ff"
                  : data.emailType === "newsletter"
                    ? "#f8f5ff"
                    : data.emailType === "welcome"
                      ? "#fffbeb"
                      : data.emailType === "product"
                        ? "#eef2ff"
                        : data.emailType === "promotion"
                          ? "#fef2f2"
                          : data.emailType === "thankyou"
                            ? "#f0fdfa"
                            : data.emailType === "holiday"
                              ? "#f0f7ff"
                              : "#f0f7ff"
        };">
          ${
            data.companyName
              ? `<div style="text-align: center; margin-bottom: 25px;">
              ${
                data.logoUrl
                  ? `<img src="${data.logoUrl}" alt="${data.companyName}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">`
                  : `<div style="display: inline-block; width: 60px; height: 60px; background-color: #ddd; border-radius: 50%; line-height: 60px; text-align: center; font-size: 24px; font-weight: bold;">${data.companyName.charAt(0)}</div>`
              }
            </div>`
              : ""
          }
          <h1 style="font-size: 24px; font-weight: bold; color: #333; ${data.emailType === "holiday" || data.emailType === "promotion" ? "text-align: center;" : ""}">${data.headerText}</h1>
          <h2 style="font-size: 18px; color: #666; margin-top: 10px; ${data.emailType === "holiday" || data.emailType === "promotion" ? "text-align: center;" : ""}">${data.subheaderText}</h2>
          <div style="margin-top: 20px; color: #444; line-height: 1.5; ${data.emailType === "holiday" ? "text-align: center;" : ""}">
            ${data.mainContent.replace(/\n/g, "<br/>")}
          </div>
          <div style="text-align: center; margin-top: 25px;">
            <a href="${data.ctaUrl}" style="display: inline-block; padding: 12px 24px; background-color: ${primaryColor}; color: white; text-decoration: none; border-radius: ${data.emailType === "event" || data.emailType === "promotion" ? "24px" : "4px"}; font-weight: 500;">${data.ctaText}</a>
          </div>
          ${data.footerText ? `<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; font-size: 12px; text-align: center;">${data.footerText}</div>` : ""}
        </div>
      </div>
    `
  }

  const generateHtmlCode = (data, themeIndex) => {
    const themeColors = themeIndex !== null ? colorThemes[themeIndex] : null
    const primaryColor = themeColors ? themeColors[0] : data.accentColor

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${data.headerText || "Email Template"}</title>
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; }
    .email-${data.emailType} { 
      padding: 30px; 
      background-color: ${
        data.emailType === "business" || data.emailType === "corporate"
          ? "#f7f7f7"
          : data.emailType === "event"
            ? "#f0f9f0"
            : data.emailType === "realestate"
              ? "#fff9f0"
              : data.emailType === "confirmation"
                ? "#f0f7ff"
                : data.emailType === "newsletter"
                  ? "#f8f5ff"
                  : data.emailType === "welcome"
                    ? "#fffbeb"
                    : data.emailType === "product"
                      ? "#eef2ff"
                      : data.emailType === "promotion"
                        ? "#fef2f2"
                        : data.emailType === "thankyou"
                          ? "#f0fdfa"
                          : data.emailType === "holiday"
                            ? "#f0f7ff"
                            : "#f0f7ff"
      }; 
    }
    .header { 
      font-size: 24px; 
      font-weight: bold; 
      color: #333;
      ${data.emailType === "holiday" || data.emailType === "promotion" ? "text-align: center;" : ""}
    }
    .subheader { 
      font-size: 18px; 
      color: #666; 
      margin-top: 10px;
      ${data.emailType === "holiday" || data.emailType === "promotion" ? "text-align: center;" : ""}
    }
    .content { 
      margin-top: 20px; 
      color: #444; 
      line-height: 1.5;
      ${data.emailType === "holiday" ? "text-align: center;" : ""}
    }
    .cta-button { 
      display: inline-block; 
      padding: 12px 24px; 
      background-color: ${primaryColor}; 
      color: white; 
      text-decoration: none; 
      border-radius: ${data.emailType === "event" || data.emailType === "promotion" ? "24px" : "4px"}; 
      font-weight: 500;
      margin-top: 25px;
    }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; font-size: 12px; text-align: center; }
    ${
      data.emailType === "holiday"
        ? '.email-holiday { background-image: url("https://via.placeholder.com/600x100/e3f2fd/e3f2fd"); background-repeat: repeat-x; background-position: top; }'
        : ""
    }
    ${data.emailType === "newsletter" ? ".email-newsletter { border-top: 4px solid #9333ea; }" : ""}
    ${
      data.emailType === "product"
        ? ".email-product { border-left: 4px solid #4f46e5; border-right: 4px solid #4f46e5; }"
        : ""
    }
    ${
      data.emailType === "thankyou"
        ? ".email-thankyou { border-top: 4px solid #14b8a6; border-bottom: 4px solid #14b8a6; }"
        : ""
    }
    ${data.emailType === "promotion" ? ".cta-button { font-size: 18px; font-weight: bold; }" : ""}
  </style>
</head>
<body>
  <div class="container">
    <div class="email-${data.emailType}">
    ${
        data.companyName
          ? `<div style="text-align: center; margin-bottom: 25px;">
        ${
          data.logoUrl
            ? `<img src="${data.logoUrl}" alt="${data.companyName}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">`
            : `<div style="display: inline-block; width: 60px; height: 60px; background-color: #ddd; border-radius: 50%; line-height: 60px; text-align: center; font-size: 24px; font-weight: bold;">${data.companyName.charAt(0)}</div>`
        }
      </div>`
          : ""
      }
      <h1 class="header">${data.headerText}</h1>
      <h2 class="subheader">${data.subheaderText}</h2>
      <div class="content">
        ${data.mainContent.replace(/\n/g, "<br/>")}
      </div>
      <div style="text-align: center;">
        <a href="${data.ctaUrl}" class="cta-button" style="display: inline-block; padding: 12px 24px; background-color: ${primaryColor}; color: white; text-decoration: none; border-radius: ${data.emailType === "event" || data.emailType === "promotion" ? "24px" : "4px"}; font-weight: 500; margin-top: 25px;">${data.ctaText}</a>
      </div>
      ${data.footerText ? `<div class="footer">${data.footerText}</div>` : ""}
    </div>
  </div>
</body>
</html>`
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-sky-500" />
          <h1 className="text-3xl font-bold text-slate-800">DraftPal</h1>
        </div>
        <p className="text-slate-600 max-w-2xl">
          Create beautiful, responsive emails in minutes with AI-powered content generation
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="preview" disabled={!generatedEmail}>
            Preview
          </TabsTrigger>
          <TabsTrigger value="code" disabled={!generatedEmail}>
            HTML Code
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TabsContent value="design" className="mt-0">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="emailType" className="text-base font-medium">
                      Template Type
                    </Label>
                    <Select value={formData.emailType} onValueChange={(value) => handleChange("emailType", value)}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select a template type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(templates).map(([key, template]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex flex-col">
                              <span>{template.name}</span>
                              <span className="text-xs text-muted-foreground">{template.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => handleChange("companyName", e.target.value)}
                        placeholder="Your Company"
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="logo">Company Logo</Label>
                      <div className="mt-1.5 flex items-center gap-4">
                        <div className="relative">
                          <Input
                            id="logo"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="sr-only"
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById("logo")?.click()}
                            className="flex items-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            <span>Upload</span>
                          </Button>
                        </div>
                        {logoPreview && (
                          <div className="relative h-10 w-10 overflow-hidden rounded-md border">
                            <img
                              src={logoPreview}
                              alt="Company logo"
                              className="h-full w-full object-contain"
                              onError={(e) => {
                                console.error("Logo preview failed to load");
                                e.target.src = "/placeholder.svg";
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="headerText">Header Text</Label>
                    <Input
                      id="headerText"
                      value={formData.headerText}
                      onChange={(e) => handleChange("headerText", e.target.value)}
                      placeholder="Announcing Our New Service"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="subheaderText">Subheader Text</Label>
                    <Input
                      id="subheaderText"
                      value={formData.subheaderText}
                      onChange={(e) => handleChange("subheaderText", e.target.value)}
                      placeholder="Take your business to the next level"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="mainContent">Main Content</Label>
                      <Badge variant="outline" className="font-normal">
                        AI-powered
                      </Badge>
                    </div>
                    <Textarea
                      id="mainContent"
                      value={formData.mainContent}
                      onChange={(e) => handleChange("mainContent", e.target.value)}
                      placeholder="Enter the main body of your email here or let AI generate it for you..."
                      rows={6}
                      className="mt-1.5 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="ctaText">Call-to-Action Text</Label>
                      <Input
                        id="ctaText"
                        value={formData.ctaText}
                        onChange={(e) => handleChange("ctaText", e.target.value)}
                        placeholder="Learn More"
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="ctaUrl">Call-to-Action URL</Label>
                      <Input
                        id="ctaUrl"
                        type="url"
                        value={formData.ctaUrl}
                        onChange={(e) => handleChange("ctaUrl", e.target.value)}
                        placeholder="https://example.com"
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="footerText">Footer Text</Label>
                    <Input
                      id="footerText"
                      value={formData.footerText}
                      onChange={(e) => handleChange("footerText", e.target.value)}
                      placeholder="© 2025 Your Company. All rights reserved."
                      className="mt-1.5"
                    />
                  </div>

                  <Separator />

                  <div>
                    <Label className="block mb-2">Accent Color</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="color"
                        value={formData.accentColor}
                        onChange={(e) => handleChange("accentColor", e.target.value)}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <span className="text-sm text-slate-500">{formData.accentColor}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="block mb-2">Color Theme</Label>
                    <div className="flex flex-wrap gap-4">
                      {colorThemes.map((theme, index) => (
                        <div
                          key={index}
                          className={cn(
                            "cursor-pointer rounded-md p-1 border-2 transition-all",
                            selectedTheme === index
                              ? "border-sky-500 scale-105"
                              : "border-transparent hover:border-slate-200",
                          )}
                          onClick={() => setSelectedTheme(index)}
                        >
                          <div className="flex">
                            {theme.map((color, i) => (
                              <div
                                key={i}
                                className="w-6 h-6 first:rounded-l-sm last:rounded-r-sm"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bgImage" className="block mb-2">
                      Background Image (optional)
                    </Label>
                    <div className="relative">
                      <Input id="bgImage" type="file" accept="image/*" onChange={handleBgUpload} className="sr-only" />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("bgImage")?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Upload background</span>
                      </Button>
                      {bgImage && <span className="ml-3 text-sm text-green-600">Background image uploaded</span>}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button onClick={generateEmail} className="flex-1" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Email
                        </>
                      )}
                    </Button>

                    <Button onClick={handleReset} variant="outline" className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Reset
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="mt-0">
            {generatedEmail && (
              <Card>
                <CardContent className="p-0 overflow-hidden">
                  <EmailPreview data={generatedEmail} selectedTheme={selectedTheme} bgImage={bgImage} />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="code" className="mt-0">
            {generatedEmail && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">HTML Code</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyHtmlToClipboard}
                      className="flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy HTML
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="relative">
                    <pre className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-auto max-h-[500px] text-sm">
                      {generateHtmlCode(generatedEmail, selectedTheme)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </div>

        {/* Preview always visible on desktop */}
        <div className="hidden lg:block">
          {generatedEmail ? (
            <Card className="mt-8">
              <CardContent className="p-0 overflow-hidden">
                <EmailPreview data={generatedEmail} selectedTheme={selectedTheme} bgImage={bgImage} />
              </CardContent>
            </Card>
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-lg h-full flex items-center justify-center p-6 mt-8">
              <div className="text-center text-slate-500">
                <div className="text-lg font-medium mb-2">Email Preview</div>
                <p>Fill in the form and click "Generate Email" to see your preview</p>
              </div>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  )
}
