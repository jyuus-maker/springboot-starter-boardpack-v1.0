package com.tinyarcade.controller.vote;

import com.tinyarcade.config.security.LoginUser;
import com.tinyarcade.dto.vote.VoteRequest;
import com.tinyarcade.dto.vote.VoteResponse;
import com.tinyarcade.service.vote.VoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 게시글·댓글·대댓글 추천·비추천 API.
 */
@RestController
@RequestMapping("/api/votes")
@RequiredArgsConstructor
public class VoteController {

    private final VoteService voteService;

    @PostMapping
    public VoteResponse vote(@AuthenticationPrincipal LoginUser loginUser,
                             @Valid @RequestBody VoteRequest request) {
        return voteService.vote(loginUser, request.targetType(), request.targetId(), request.voteType());
    }
}
