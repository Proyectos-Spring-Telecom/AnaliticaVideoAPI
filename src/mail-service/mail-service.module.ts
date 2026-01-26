import { Module } from '@nestjs/common';
import { MailServiceService } from './mail-service.service';

@Module({
  providers: [MailServiceService],
  exports: [MailServiceService], // 👈 CLAVE para poder inyectarlo en otros módulos
})
export class MailServiceModule {}
