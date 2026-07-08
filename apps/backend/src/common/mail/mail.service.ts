import { Injectable, Logger } from '@nestjs/common'
import { Resend } from 'resend'

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private readonly resend: Resend | null
  private readonly from: string

  constructor() {
    const apiKey = process.env.RESEND_API_KEY
    this.from = process.env.MAIL_FROM ?? 'TOOLBOX <onboarding@resend.dev>'

    if (!apiKey) {
      this.logger.error(
        'RESEND_API_KEY no está configurado — el envío de emails va a fallar hasta que se configure.',
      )
      this.resend = null
      return
    }
    this.resend = new Resend(apiKey)
  }

  async enviarResetPassword(email: string, resetUrl: string): Promise<void> {
    if (!this.resend) {
      throw new Error('MailService no está configurado (falta RESEND_API_KEY).')
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: [email],
      subject: 'Recuperar contraseña — TOOLBOX',
      html: `
        <p>Recibimos una solicitud para restablecer tu contraseña en TOOLBOX.</p>
        <p><a href="${resetUrl}">Hacé click acá para elegir una nueva contraseña</a></p>
        <p>Este link vence en 1 hora. Si no fuiste vos quien lo pidió, podés ignorar este email.</p>
      `,
    })

    if (error) {
      throw new Error(`Resend rechazó el envío: ${error.message}`)
    }
  }
}
