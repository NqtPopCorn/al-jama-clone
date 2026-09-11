import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CommentService } from '../services/comment.service';
import { CreateCommentDto } from '../dto/create-comment.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('items/:itemId/comments')
  createForItem(@Param('itemId') itemId: string, @Body() dto: CreateCommentDto, @Req() req: any) {
    return this.commentService.create(itemId, dto, req.user.id);
  }

  @Get('items/:itemId/comments')
  findAllByItem(@Param('itemId') itemId: string) {
    return this.commentService.findByItem(itemId);
  }

  @Post('projects/:projectId/comments')
  createForProject(
    @Param('projectId') projectId: string,
    @Body() dto: CreateCommentDto,
    @Req() req: any,
  ) {
    return this.commentService.createForProject(projectId, dto, req.user.id);
  }

  @Get('projects/:projectId/comments')
  findAllByProject(@Param('projectId') projectId: string) {
    return this.commentService.findByProject(projectId);
  }
}
