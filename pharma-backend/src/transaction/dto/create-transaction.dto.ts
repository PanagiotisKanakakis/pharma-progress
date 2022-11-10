import {
    IsEnum,
    IsNotEmpty,
    IsNumberString,
    IsOptional,
    IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentType, SupplierType, TransactionType, VAT } from '../enums';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
    @IsNotEmpty()
    @IsString()
    @Type(() => String)
    createdAt: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    comment: string;

    @IsNotEmpty()
    @IsNumberString()
    @Type(() => String)
    cost: string;

    @IsNotEmpty()
    @IsNumberString()
    @Type(() => String)
    userId: string;

    @IsNotEmpty()
    @ApiProperty({
        enum: TransactionType,
        enumName: 'TransactionType',
    })
    @IsEnum(TransactionType)
    transactionType: TransactionType;

    @IsNotEmpty()
    @ApiProperty({
        enum: VAT,
        enumName: 'VAT',
    })
    @IsEnum(VAT)
    vat: VAT;

    @IsNotEmpty()
    @ApiProperty({
        enum: PaymentType,
        enumName: 'PaymentType',
    })
    @IsEnum(PaymentType)
    paymentType: PaymentType;

    @IsNotEmpty()
    @ApiProperty({
        enum: SupplierType,
        enumName: 'SupplierType',
    })
    @IsEnum(SupplierType)
    supplierType: SupplierType;
}
