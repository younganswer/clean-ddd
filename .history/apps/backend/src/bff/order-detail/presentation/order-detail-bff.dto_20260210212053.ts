import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class GetOrderDetailBffQueryDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includePayment?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeShipment?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeReservations?: boolean;
}
