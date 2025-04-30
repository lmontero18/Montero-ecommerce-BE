import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseJSONPipe implements PipeTransform {
  constructor(private readonly fields: string[]) {}

  transform(value: any) {
    for (const field of this.fields) {
      if (value[field] && typeof value[field] === 'string') {
        try {
          value[field] = JSON.parse(value[field]);
        } catch (err) {
          console.error(`❌ Error al parsear campo '${field}':`, value[field]);
          throw new BadRequestException(
            `Campo '${field}' no es un JSON válido`,
          );
        }
      }
    }
    return value;
  }
}
