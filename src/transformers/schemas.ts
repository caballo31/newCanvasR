import { z } from 'zod'

export const summarySchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  tags: z.array(z.string()).default([]),
})

export type SummaryOutput = z.infer<typeof summarySchema>
