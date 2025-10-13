import { Module } from '@nestjs/common';
import { ModelosService } from './modelos.service';
import { ModelosController } from './modelos.controller';

@Module({
  controllers: [ModelosController],
  providers: [ModelosService],
})
export class ModelosModule {}
