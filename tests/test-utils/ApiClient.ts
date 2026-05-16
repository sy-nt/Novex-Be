import { routesV1 } from '@user/configs/app.routes';
import { IdResponse } from '@core/api/id.response.dto';
import { CreateUserRequestDto } from '@user/modules/user/commands/create-user/create-user.request.dto';
import { UserPaginatedResponseDto } from '@user/modules/user/dtos/user.paginated.response.dto';
import { getHttpServer } from '@tests/setup/jestSetupAfterEnv';

const userRoutes = routesV1.user as { root: string };

export class ApiClient {
  private readonly url = `/${routesV1.version}/${userRoutes.root}`;

  async createUser(dto: CreateUserRequestDto): Promise<IdResponse> {
    const response = await getHttpServer().post(this.url).send(dto);
    return response.body as IdResponse;
  }

  async deleteUser(id: string): Promise<void> {
    await getHttpServer().delete(`${this.url}/${id}`);
  }

  async findAllUsers(): Promise<UserPaginatedResponseDto> {
    const response = await getHttpServer().get(this.url);
    return response.body as UserPaginatedResponseDto;
  }
}
