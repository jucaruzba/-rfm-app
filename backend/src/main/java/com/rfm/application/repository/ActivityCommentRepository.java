package com.rfm.application.repository;


import java.util.List;
import com.rfm.application.model.entity.ActivityComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ActivityCommentRepository extends JpaRepository<ActivityComment, Long> {
    
    List<ActivityComment> findByIdActivityOrderByCreatedAtDesc(Long idActivity);
    
    @Modifying
    @Query("DELETE FROM ActivityComment c WHERE c.idActivity = :idActivity")
    void deleteAllByIdActivity(Long idActivity);
}