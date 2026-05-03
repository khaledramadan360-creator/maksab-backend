import { WhatChimpGateway } from '../../domain/repositories';
import {
  GetWhatChimpPhoneNumberOptionsCommand,
  GetWhatChimpPhoneNumberOptionsResult,
} from '../dto/reports.commands';
import { ClientReportOwnershipService } from '../services/client-report-ownership.service';

export class GetWhatChimpPhoneNumberOptionsUseCase {
  constructor(
    private readonly ownershipService: ClientReportOwnershipService,
    private readonly whatChimpGateway: WhatChimpGateway
  ) {}

  async execute(
    command: GetWhatChimpPhoneNumberOptionsCommand
  ): Promise<GetWhatChimpPhoneNumberOptionsResult> {
    this.ownershipService.assertActorIdentity(command.actorUserId, command.actorUserRole);
    this.ownershipService.assertCanSendReport(command.actorUserRole);

    return {
      options: this.whatChimpGateway.getPhoneNumberOptions(),
      defaultPhoneNumberId: this.whatChimpGateway.getDefaultPhoneNumberId(),
      allowCustomPhoneNumberId: this.whatChimpGateway.allowsCustomPhoneNumberId(),
    };
  }
}
