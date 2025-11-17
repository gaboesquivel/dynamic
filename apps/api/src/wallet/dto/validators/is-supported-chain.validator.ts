import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator'
import { isSupportedChain } from '../../../common/chains'

/**
 * Custom validator decorator to check if chainId is supported.
 * Works with both number (EVM chain IDs) and string (Dynamic network IDs, Solana clusters).
 */
export function IsSupportedChain(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSupportedChain',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value === null || value === undefined) return false
          return isSupportedChain(value as number | string)
        },
        defaultMessage(args: ValidationArguments) {
          return `Chain ID ${args.value} is not supported. Please provide a valid chain ID or Dynamic network ID.`
        },
      },
    })
  }
}
